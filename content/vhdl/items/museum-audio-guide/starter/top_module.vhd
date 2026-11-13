library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
entity top_module is
    port(beacon:in std_logic_vector(7 downto 0);
    listen_button,signal_present:in std_logic;
    recognized_stop,speaker_volume:out std_logic_vector(3 downto 0);
    play_request:out std_logic);
end entity;
architecture rtl -- Complete the TODOs in this starter.
    of top_module is
    signal stop_i,volume_i:std_logic_vector(3 downto 0);
    begin
    receiver:entity work.guide_receiver port map(beacon=>beacon,stop_id=>stop_i,volume=>volume_i);
    recognized_stop<=(others=>'0');
    speaker_volume<=(others=>'0');
    play_request<=listen_button or signal_present;
end architecture;
