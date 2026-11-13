library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;

entity top_module is
    port (
        sample : in std_logic_vector(7 downto 0);
        signed_sample : in std_logic_vector(7 downto 0);
        doubled : out std_logic_vector(7 downto 0);
        discarded : out std_logic;
        halved : out std_logic_vector(7 downto 0)
    );
end entity;

architecture rtl of top_module is
begin
    -- Task 1. Shift left and report loss: implement this requirement.
    -- Task 2. Arithmetic-shift a signed value: implement this requirement.
    doubled <= (others => '0');
    discarded <= '0';
    halved <= (others => '0');
end architecture;
